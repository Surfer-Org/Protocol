import chromadb
import os
import sys
import json

user_data_path = sys.argv[1]


# Initialize ChromaDB client with persistent storage
persistent_dir = os.path.join(user_data_path, "vector_db")
client = chromadb.PersistentClient(path=persistent_dir)

# Get collection
collection = client.get_collection("surfer_collection")

existing_chunks = collection.get()
names_array = list(set(chunk['name'] for chunk in existing_chunks['metadatas']))
print(names_array)