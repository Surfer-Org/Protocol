import chromadb
import os
import sys
import json

user_data_path = sys.argv[1]
query = sys.argv[2]
platform = sys.argv[3]

try:
    # Initialize ChromaDB client with persistent storage
    persistent_dir = os.path.join(user_data_path, "vector_db")
    client = chromadb.PersistentClient(path=persistent_dir)
    
    # Get collection
    collection = client.get_collection("surfer_collection")
    
    # Perform search
    results = collection.query(
        query_texts=[query],
        n_results=5,
        where={"name": platform}  # Return top 5 results
    
    )
    
    # Format results for output
    formatted_results = {
        "documents": results["documents"][0],
        "distances": results["distances"][0],
        "ids": results["ids"][0],
        "metadata": results["metadatas"][0]
    }
    
    # Print as JSON for easy parsing
    print(json.dumps(formatted_results))

except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    sys.exit(1)

