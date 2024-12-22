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
    regular_results = collection.query(
        query_texts=[query],
        n_results=5,
        where={"name": platform}
    )

    # full_text_results = collection.query(
    #     query_texts=[query],
    #     n_results=5,
    #     where={"name": platform},
    #     where_document={"$contains":query}
    # )

    # full_results = {
    #     "regular_results": regular_results,
    #     "full_text_results": full_text_results
    # }
    
    # Format results for output
    formatted_results = {
        "documents": regular_results["documents"][0],
        "distances": regular_results["distances"][0],
        "ids": regular_results["ids"][0],
        "metadata": regular_results["metadatas"][0]
    }
    
    # Print as JSON for easy parsing
    print(json.dumps(formatted_results))

except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    sys.exit(1)

