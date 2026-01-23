from flask import Flask, request, jsonify
from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
from langchain_huggingface import HuggingFaceEmbeddings
import google.generativeai as genai
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate 
from dotenv import load_dotenv
from flask_cors import CORS
import time

# Initialize Flask app
app = Flask(__name__)

# CORS Configuration - Allow frontend origins
CORS(app, 
     origins=["https://legal-nexus-pi.vercel.app", "http://localhost:5100", "http://localhost:5173"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
     supports_credentials=True)

# Load environment variables
load_dotenv()

# Get API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("Missing GOOGLE_API_KEY. Please set it in your .env file.")

genai.configure(api_key=GOOGLE_API_KEY)

VECTOR_STORE_PATH = "faiss_index"
TEXT_FILE_PATH = "uploaded_text.txt"

print("[OK] Document Analyzer initialized with local embeddings")


def get_pdf_text(pdf_docs):
    """Extract text from uploaded PDF files"""
    text = ""
    for pdf in pdf_docs:
        try:
            pdf_reader = PdfReader(pdf)
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted
        except Exception as e:
            print(f"[ERROR] Error reading PDF: {str(e)}")
    return text.strip()


def get_text_chunks(text):
    """Split text into manageable chunks"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=10000, 
        chunk_overlap=1000
    )
    return text_splitter.split_text(text)


def get_vector_store(text_chunks):
    """Create FAISS vector store using FREE local embeddings"""
    try:
        print("- Loading FREE local embeddings model...")
        embeddings = HuggingFaceEmbeddings(
            model_name='sentence-transformers/all-MiniLM-L6-v2'
        )
        print("[OK] Embeddings model loaded")
        
        vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
        vector_store.save_local(VECTOR_STORE_PATH)
        print("[OK] Vector store created successfully")
    except Exception as e:
        print(f"[ERROR] Error creating vector store: {str(e)}")
        raise


def generate_explanation(text, language):
    """Generate simplified explanation of legal document using FREE API"""
    prompt = f"""You are a legal expert and document interpreter. Your task is to:

1. Analyze the provided legal document.
2. Explain it in simple {language} using everyday language.
3. Break down complex legal terms into plain language.
4. Clearly mention key obligations, rights, and deadlines.
5. Provide a summary checklist for the user.
6. Each point must appear on its own line and be prefixed by a dash (-), like this:
    - Point 1
    - Point 2
    - Point 3
7. Use line breaks for better readability.
8. Do NOT use markdown formatting like ** or * at all.
9. Ensure proper spacing and readability throughout.

Document Content:
{text[:10000]}

Explanation:"""
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        if response.text:
            print("[OK] Explanation generated successfully")
            return response.text
        else:
            print("[ERROR] No response from API")
            return "Could not generate explanation. Please try again."
            
    except Exception as e:
        print(f"[ERROR] Error generating explanation: {str(e)}")
        return f"Error: {str(e)[:100]}. Please check your API key and quota."


def get_conversational_response(context, question, language="English"):
    """Get response from Gemini for a question"""
    prompt_template = """You are a multilingual legal assistant. Follow these rules carefully:

1. You MUST respond in {language}.
2. If the answer is not available in the context, still respond helpfully as a legal assistant.
3. Always provide accurate, legally sound, and easy-to-understand responses.

When providing your response:
- Use clean line breaks between paragraphs.
- Use bullet points (•) for listing steps or points.
- Do not use bold formatting like ** or __.
- Keep the language natural, respectful, and professional.
- Structure your response for readability with proper spacing.
- IMPORTANT: Your entire response must be in {language}.

Context from document:
{context}

User Question:
{question}

Your Answer (in {language}):"""
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        formatted_prompt = prompt_template.format(context=context, question=question, language=language)
        
        response = model.generate_content(formatted_prompt)
        
        if response.text:
            print("[OK] Response generated successfully")
            return response.text
        else:
            return "Could not generate response. Please try again."
            
    except Exception as e:
        print(f"[ERROR] Error generating response: {str(e)}")
        return f"Error: {str(e)[:100]}"


def answer_question(user_question, language="English"):
    """Answer questions based on uploaded documents"""
    try:
        # Load embeddings (FREE - runs locally)
        embeddings = HuggingFaceEmbeddings(
            model_name='sentence-transformers/all-MiniLM-L6-v2'
        )

        if not os.path.exists(VECTOR_STORE_PATH):
            return "No document found. Please upload a document first."

        # Load vector store
        new_db = FAISS.load_local(
            VECTOR_STORE_PATH, 
            embeddings, 
            allow_dangerous_deserialization=True
        )
        
        print(f"[SEARCH] Retrieving documents for: {user_question[:50]}...")
        docs = new_db.similarity_search(user_question, k=3)

        if not docs:
            context_string = "No relevant context found."
            print("[WARN] No relevant documents found in vector store.")
        else:
            context_string = "\n\n".join([doc.page_content for doc in docs])
            print(f"[OK] Found {len(docs)} relevant documents")

        # Get response from Gemini with language
        response = get_conversational_response(context_string, user_question, language)
        
        return response
    
    except Exception as e:
        print(f"[ERROR] Error answering question: {str(e)}")
        return f"Error processing question: {str(e)}"


# ========== API ENDPOINTS ==========

@app.route("/upload", methods=["POST"])
def upload_pdf():
    """Upload and process PDF documents"""
    if "pdfs" not in request.files:
        return jsonify({"error": "No PDF file uploaded"}), 400

    pdf_files = request.files.getlist("pdfs")
    
    if not pdf_files:
        return jsonify({"error": "No files provided"}), 400

    try:
        print(f"\n- Processing {len(pdf_files)} PDF file(s)...")
        text = get_pdf_text(pdf_files)
        
        if not text:
            return jsonify({"error": "No text found in the uploaded PDFs"}), 400

        print("- Splitting text into chunks...")
        text_chunks = get_text_chunks(text)
        
        print("- Creating vector store with FREE embeddings...")
        get_vector_store(text_chunks)

        # Save extracted text
        with open(TEXT_FILE_PATH, "w", encoding="utf-8") as f:
            f.write(text)

        print("✅ PDFs processed successfully!\n")
        return jsonify({
            "message": "PDFs processed successfully!",
            "chunks": len(text_chunks),
            "text_length": len(text)
        }), 200
    
    except Exception as e:
        print(f"❌ Error processing PDFs: {str(e)}\n")
        return jsonify({"error": f"Error processing PDFs: {str(e)}"}), 500


@app.route("/explain", methods=["GET"])
def explain():
    """Generate explanation of uploaded document"""
    language = request.args.get("language", "English")

    if not os.path.exists(TEXT_FILE_PATH):
        return jsonify({"error": "No document found. Please upload a document first."}), 404

    try:
        print(f"\n- Generating explanation in {language}...")
        
        with open(TEXT_FILE_PATH, "r", encoding="utf-8") as f:
            text = f.read()

        explanation = generate_explanation(text, language)
        
        print("✅ Explanation complete!\n")
        return jsonify({"explanation": explanation}), 200
    
    except Exception as e:
        print(f"❌ Error generating explanation: {str(e)}\n")
        return jsonify({"error": f"Error generating explanation: {str(e)}"}), 500


@app.route("/ask", methods=["POST"])
def ask_question_route():
    """Ask questions about uploaded documents"""
    data = request.get_json()
    user_question = data.get("question", "").strip()
    language = data.get("language", "English")

    if not user_question:
        return jsonify({"error": "No question provided"}), 400

    try:
        print(f"\n- Processing question in {language}: {user_question[:50]}...")
        answer = answer_question(user_question, language)
        print("✅ Question answered!\n")
        return jsonify({"answer": answer}), 200
    
    except Exception as e:
        print(f"❌ Error processing question: {str(e)}\n")
        return jsonify({"error": f"Error processing question: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "OK",
        "message": "Document Analyzer service is running",
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2 (FREE)",
        "llm_model": "gemini-2.5-flash (FREE)", # Updated model name
        "vector_store_exists": os.path.exists(VECTOR_STORE_PATH),
        "document_loaded": os.path.exists(TEXT_FILE_PATH)
    }), 200


@app.route("/", methods=["GET"])
def index():
    """API info endpoint"""
    return jsonify({
        "service": "LegalNexus Document Analyzer",
        "version": "1.0",
        "endpoints": {
            "POST /upload": "Upload PDFs for analysis",
            "GET /explain": "Get document explanation",
            "POST /ask": "Ask questions about document",
            "GET /health": "Health check",
            "GET /": "This info"
        },
        "features": [
            "[OK] FREE embeddings (no API costs)",
            "[OK] FREE Gemini API",
            "[OK] Multi-language support",
            "[OK] Local vector storage",
            "[OK] No quota limits for embeddings"
        ]
    }), 200


if __name__ == "__main__":
    print("\n" + "="*50)
    print("- Starting Document Analyzer Service")
    print("="*50)
    port = int(os.environ.get("PORT", 7860))
    print(f" Server URL: http://localhost:{port}")
    print(f" Health check: http://localhost:{port}/health")
    print(f" API info: http://localhost:{port}/")
    print("\n Ready to analyze legal documents!\n")
    
    app.run(host="0.0.0.0", port=port, debug=False)