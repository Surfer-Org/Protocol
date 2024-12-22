import chromadb
import os
import sys
from chromadb.utils import embedding_functions
import json
import uuid
import base64
import time  # Add this at the top with other imports
import traceback  # Add this import at the top

embedding_function = embedding_functions.DefaultEmbeddingFunction

    # Print script location
user_data_path = sys.argv[1]
json_file_path = sys.argv[2]
latest_run_base64 = sys.argv[3]

# Decode the base64 string back to JSON
latest_run = json.loads(base64.b64decode(latest_run_base64).decode('utf-8'))
platform_id = latest_run['platformId']

    # Read JSON from file
with open(json_file_path, 'r', encoding='utf-8') as f:
    json_data = json.load(f)
    

try:
    # Initialize ChromaDB client with persistent storage
    persistent_dir = os.path.join(user_data_path, "vector_db")
    if not os.path.exists(persistent_dir):
        os.makedirs(persistent_dir)

    
        
    client = chromadb.PersistentClient(path=persistent_dir)
        
    # Create or get collection
    collection_name = "surfer_collection"
    existing_collections = client.list_collections()
    collection_exists = any(coll.name == collection_name for coll in existing_collections)

    if not collection_exists:
        collection = client.create_collection(
            name=collection_name,
            metadata={"description": "Main collection for Surfer data"}
        )
        
    else:
        collection = client.get_collection(collection_name)
    

    # Print all collections
    all_collections = client.list_collections()

    if not json_data:
        raise ValueError("No JSON data provided")
    
    docs_key = latest_run['vectorize_config']['documents']
    
    total_items = len(json_data['content'])
    print(f"progress:{platform_id}:0/{total_items}", flush=True)
    
    total_chunks_overall = 0
    added_chunks_overall = 0
    start_time = time.time()
    
    for index, obj in enumerate(json_data['content']):
        # Add validation for required keys
        if docs_key not in obj:
            print(f"Warning: Document at index {index} missing required key '{docs_key}'. Skipping.", flush=True)
            continue
            
        document_id = f"{latest_run['id']}-{index}"
        
        # Create metadata dictionary
        metadata = {"name": latest_run['name']}
        for key, value in obj.items():
            if key != docs_key and key != 'id':
                if isinstance(value, dict):
                    metadata[key] = json.dumps(value)
                elif value is None:
                    metadata[key] = 'None'
                else:
                    metadata[key] = str(value)  # Convert all values to strings
        
        # Ensure the document content is a string
        document_content = obj[docs_key]
        if not isinstance(document_content, str):
            document_content = str(document_content)
        
        # Chunk the document content
        docs_key_chunks = [document_content[i:i+1000] for i in range(0, len(document_content), 1000)]
        total_chunks = len(docs_key_chunks)
        added_chunks = 0

        # Get existing chunks once before the loop
        existing_data = collection.get()
        existing_docs = existing_data['documents']
        existing_metadatas = existing_data['metadatas']

        for chunk in docs_key_chunks:
            # Check if this chunk with the same metadata exists
            is_duplicate = False
            for existing_doc, existing_metadata in zip(existing_docs, existing_metadatas):
                if (chunk == existing_doc and 
                    existing_metadata.get('name') == metadata['name']):
                    is_duplicate = True
                    break
            
            if is_duplicate:
                continue
            
            collection.upsert(
                documents=[chunk],
                ids=[str(uuid.uuid4())],  # Generate unique ID for each chunk
                metadatas=[metadata]
            )
            added_chunks += 1
        
        total_chunks_overall += total_chunks
        added_chunks_overall += added_chunks
        
        # print('Chunk: ', chunk)
        # print('Metadata: ', metadata)
        # print(f"Chunks for document {index}: {added_chunks} added out of {total_chunks} total", flush=True)
        print(f"progress:{platform_id}:{index + 1}/{total_items}", flush=True)
    
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    print(f"Total chunks processed: {added_chunks_overall} added out of {total_chunks_overall} total", flush=True)
    print(f"Total processing time: {elapsed_time:.2f} seconds", flush=True)
    print(f"progress:{platform_id}:{total_items}/{total_items}", flush=True)

except Exception as e:
    print(f"Error initializing vector database: {str(e)}", file=sys.stderr, flush=True)
    print(f"Traceback:", traceback.format_exc(), file=sys.stderr, flush=True)
    sys.exit(1)