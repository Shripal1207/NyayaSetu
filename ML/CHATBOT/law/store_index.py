from src.helper import load_pdf_file, text_split, download_hugging_face_embeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv
import os
import time

# Load environment variables
load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')

if not PINECONE_API_KEY:
    raise ValueError("❌ PINECONE_API_KEY not found in .env file")

# Set environment variable
os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY

print("📚 Loading PDF files...")
extracted_data = load_pdf_file(data='Data/')
print(f"✅ Loaded {len(extracted_data)} documents")

print("✂️ Splitting text into chunks...")
text_chunks = text_split(extracted_data)
print(f"✅ Created {len(text_chunks)} text chunks")

print("🤖 Downloading embeddings model...")
embeddings = download_hugging_face_embeddings()
print("✅ Embeddings model ready")

# Initialize Pinecone client
print("🔌 Connecting to Pinecone...")
pc = Pinecone(api_key=PINECONE_API_KEY)

index_name = "lawbot2"

# Check if index exists
existing_indexes = pc.list_indexes()
index_names = [index.name for index in existing_indexes]

if index_name not in index_names:
    print(f"🆕 Creating new index: {index_name}")
    pc.create_index(
        name=index_name,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        )
    )
    
    # Wait for index to be ready
    print("⏳ Waiting for index to initialize...")
    time.sleep(10)
    print("✅ Index created successfully")
else:
    print(f"✅ Index '{index_name}' already exists")

# Store documents in Pinecone
print("📝 Storing documents in Pinecone vector database...")
print("⏳ This may take a few minutes...")

try:
    docsearch = PineconeVectorStore.from_documents(
        documents=text_chunks,
        embedding=embeddings,
        index_name=index_name
    )
    print("✅ Documents stored successfully in Pinecone!")
    print(f"✅ Total chunks indexed: {len(text_chunks)}")
except Exception as e:
    print(f"❌ Error storing documents: {str(e)}")
    raise

print("\n🎉 Setup complete! You can now run app.py")
