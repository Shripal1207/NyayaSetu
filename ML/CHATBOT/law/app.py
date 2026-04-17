from flask import Flask, render_template, request, jsonify, session
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv
from flask_cors import CORS
import os
import re
from datetime import datetime


def download_hugging_face_embeddings():
    """Download and initialize HuggingFace embeddings model"""
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2'
    )
    return embeddings


def format_response(text):
    """Format the bot response for better readability"""
    # Remove ** from bold text
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    
    # Convert numbered points into separate lines
    text = re.sub(r"(\d+\.)", r"<br>\1", text)  
    
    # Bold headings
    text = re.sub(r"(\d+\.\s)(.*?):", r"\1<b>\2</b>:", text)  
    
    # Ensure newlines are converted to <br> tags
    text = text.replace("\n", "<br>")
    
    return text.strip()


# Load environment variables
load_dotenv()

# Retrieve API keys
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Ensure API keys are set
if not PINECONE_API_KEY:
    raise ValueError("Missing PINECONE_API_KEY. Please set it in your .env file.")
if not GROQ_API_KEY:
    raise ValueError("Missing GROQ_API_KEY. Please set it in your .env file.")

os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management
CORS(app, supports_credentials=True)

# Store chat histories in memory (per session)
chat_histories = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    """Get or create chat history for a session"""
    if session_id not in chat_histories:
        chat_histories[session_id] = ChatMessageHistory()
    return chat_histories[session_id]


# Load embeddings
print("[BOT] Loading embeddings model...")
embeddings = download_hugging_face_embeddings()
print("[OK] Embeddings loaded")

index_name = "lawbot2"

# Connect to the existing Pinecone index
print("[CONNECT] Connecting to Pinecone...")
docsearch = PineconeVectorStore.from_existing_index(
    index_name=index_name,
    embedding=embeddings
)
print("[OK] Connected to Pinecone")

retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k": 6})

# Initialize LLM model
print("[BRAIN] Initializing Groq LLM...")
llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.3-70b-versatile",
    temperature=0.3
)
print("[OK] LLM initialized")

# Custom system prompt
system_prompt = """You're LawBot, a friendly AI helping people understand Indian legal cases in simple, modern English. 
Speak clearly, be helpful, and sound like you're chatting with a friend—not a courtroom judge.

System Role:
You are LawBot, a helpful AI that explains Indian legal issues and tells users under which sections they can file a case. You are not a lawyer and cannot give legal advice. Your job is to (1) identify relevant sections (e.g. IPC, CrPC, or other acts) for filing a case, and (2) explain those sections using ONLY the context from the legal documents provided below.

When the user describes a situation or asks "where can I file a case" or "which section applies":

1. **Applicable section(s):** Clearly state under which section(s) or act they can file a case (e.g. IPC Section 420, Section 378, CrPC, Consumer Protection Act, etc.). If the context mentions specific sections, use those. If multiple sections may apply, list them with a short reason.

2. **What the section says:** Explain what that section/act says using ONLY the text from "Context from legal documents" below. Quote or paraphrase from the context. Do not invent section text—if the context does not contain the section text, say "The provided documents do not contain the full text of this section; consult the bare act or a lawyer for exact wording."

3. **In simple words:** In 1–2 lines, explain in simple language what it means for the user (e.g. what the offence is, what the court can do).

4. **Next steps:** Suggest they consult a lawyer for filing and procedure, and mention they can refer to Indian Kanoon or official bare acts for full section text.

Tone and Language:
- Be friendly, supportive, and respectful. Use everyday language; explain legal terms simply.
- Structure your reply with clear headings or numbers: Applicable section(s), What the section says, In simple words, Next steps.

Important Rules:
- NEVER make up or guess section numbers or section text. Use ONLY what is in the "Context from legal documents" below.
- If the context does not mention any relevant section for the user's situation, say so and suggest they share more details or consult a lawyer with their documents.
- Never give direct legal advice (e.g. "you will win"). Always suggest speaking to a real lawyer for legal action.

Context from legal documents (use this to find sections and explain them):
{context}

Chat History:
{chat_history}

User Question: {question}

Your Response:"""

# Create prompt template
prompt = ChatPromptTemplate.from_template(system_prompt)


def get_context_from_retriever(question):
    """Retrieve relevant context from Pinecone"""
    try:
        docs = retriever.invoke(question)
        context = "\n\n".join([doc.page_content for doc in docs])
        return context
    except Exception as e:
        print(f"[ERROR] Error retrieving context: {str(e)}")
        return ""


def format_chat_history(messages):
    """Format chat history for the prompt"""
    formatted = []
    for msg in messages:
        if hasattr(msg, 'type'):
            role = "Human" if msg.type == "human" else "AI"
            formatted.append(f"{role}: {msg.content}")
    return "\n".join(formatted[-6:])  # Keep last 6 messages (3 exchanges)


print("[OK] Chat system ready!")


# Routes
@app.route("/chat")
def index():
    """Render chat interface"""
    # Create a new session ID if not exists
    if 'session_id' not in session:
        session['session_id'] = str(datetime.now().timestamp())
    return render_template('chat.html')


@app.route("/get", methods=["POST"])
def chat():
    """Handle chat messages"""
    data = request.json
    msg = data.get("msg", "").strip()

    if not msg:
        return jsonify({"error": "No input received."}), 400

    # Get or create session ID
    session_id = session.get('session_id', str(datetime.now().timestamp()))
    session['session_id'] = session_id

    try:
        # Get chat history for this session
        history = get_session_history(session_id)
        
        # Get relevant context from Pinecone
        context = get_context_from_retriever(msg)
        
        # Format chat history
        chat_history_text = format_chat_history(history.messages)
        
        # Create the prompt
        formatted_prompt = prompt.format(
            context=context,
            chat_history=chat_history_text,
            question=msg
        )
        
        # Get response from LLM
        response = llm.invoke(formatted_prompt)
        bot_answer = response.content
        
        # Add to chat history
        history.add_user_message(msg)
        history.add_ai_message(bot_answer)
        
        # Format response for display
        formatted_response = bot_answer.replace("\n", "<br>")

        return jsonify({"response": formatted_response})
    
    except Exception as e:
        print(f"❌ Error processing request: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to process request. Please try again."}), 500


@app.route("/chat_history", methods=["GET"])
def chat_history():
    """Retrieve conversation history"""
    try:
        session_id = session.get('session_id')
        if not session_id:
            return jsonify({"history": []})
        
        history = get_session_history(session_id)
        
        # Format messages
        messages = []
        for msg in history.messages:
            messages.append({
                "type": msg.type,
                "content": msg.content
            })
        
        return jsonify({"history": messages})
    
    except Exception as e:
        print(f"❌ Error retrieving history: {str(e)}")
        return jsonify({"error": "Failed to retrieve chat history"}), 500


@app.route("/chat/clear", methods=["POST"])
def clear_chat():
    """Clear chat history for current session"""
    try:
        session_id = session.get('session_id')
        if session_id and session_id in chat_histories:
            del chat_histories[session_id]
            session['session_id'] = str(datetime.now().timestamp())
        
        return jsonify({"message": "Chat history cleared"})
    
    except Exception as e:
        print(f"[ERROR] Error clearing history: {str(e)}")
        return jsonify({"error": "Failed to clear history"}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "OK",
        "message": "LawBot chatbot service is running",
        "model": "llama-3.3-70b-versatile",
        "index": index_name,
        "active_sessions": len(chat_histories)
    })


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 7860))
    print("\n[START] Starting LawBot Flask server...")
    print(f"[URL] Server URL: http://localhost:{port}")
    print(f"[CHAT] Chat interface: http://localhost:{port}/chat")
    print(f"[HEALTH] Health check: http://localhost:{port}/health")
    print("\n[READY] Ready to help with legal queries!\n")
    
    app.run(host="0.0.0.0", port=port, debug=False)
