import networkx as nx
from pyvis.network import Network
import matplotlib.pyplot as plt
from surfer_protocol import SurferClient
from helpers import extract_nodes, extract_edges
import json
from datetime import datetime

surfer_client = SurferClient()
data = surfer_client.get('platform-001')

# Initialize both NetworkX and Pyvis graphs
G = nx.Graph()
net = Network(height="750px", width="100%", bgcolor="#ffffff", font_color="black", select_menu=True, filter_menu=True)
net.barnes_hut()
net.toggle_physics(True)
plt.figure(figsize=(15, 10))

# Add near the top of the file, after network initialization
net.show_buttons(filter_=['physics'])

def display_graph(G, title):
    # Update Pyvis network
    net.from_nx(G)
    
    # Configure node and edge appearance
    for node in net.nodes:
        node.update({
            'size': 25,
            'label': G.nodes[node['id']].get('label', ''),
            'title': G.nodes[node['id']].get('text', ''),  # Hover text
            'color': '#6AACF0',
            'value': len([n for n in G.neighbors(node['id'])])  # Node size based on connections
        })
    
    for edge in net.edges:
        edge.update({
            'label': G.edges[edge['from'], edge['to']].get('label', ''),
            'width': 2,
            'font': {'size': 10}
        })
    
    # Save interactive HTML with a fixed filename during processing
    net.save_graph('graph_current.html')

def save_graph(G):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save final HTML with timestamp
    net.save_graph(f'graph_{timestamp}.html')
    
    # Save JSON
    graph_data = {
        "nodes": [
            {
                "id": node,
                "label": G.nodes[node].get('label'),
                "text": G.nodes[node].get('text')
            } for node in G.nodes()
        ],
        "edges": [
            {
                "from": u,
                "to": v,
                "label": G.edges[u, v].get('label')
            } for u, v in G.edges()
        ]
    }
    
    with open(f'graph_{timestamp}.json', 'w') as f:
        json.dump(graph_data, f, indent=2)
    
    print(f"\nFinal graph saved as:\ngraph_{timestamp}.html\ngraph_{timestamp}.json")

try:
    for bookmark in data['data']['content']:
        # Extract and add nodes
        new_nodes = extract_nodes(bookmark, [{"id": n, "label": G.nodes[n].get('label')} for n in G.nodes()])
        
        for node in new_nodes:
            G.add_node(node['id'], label=node['label'], text=node['text'])
        
        # Extract and add edges
        if len(G.nodes()) > 1:
            edges_data = {
                "newNodes": new_nodes,
                "currentEdges": [
                    {"from": u, "to": v, "label": G.edges[u, v].get('label')} 
                    for u, v in G.edges()
                ]
            }
            
            new_edges = extract_edges(edges_data)
            
            for edge in new_edges:
                G.add_edge(edge['from'], edge['to'], label=edge['label'])
        
        # Display updated graph
        display_graph(G, f'Knowledge Graph (Nodes: {len(G.nodes())}, Edges: {len(G.edges())})')

except Exception as e:
    print(f"\nAn error occurred: {e}")
    save_graph(G)

finally:
    save_graph(G)