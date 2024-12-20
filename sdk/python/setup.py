from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="surfer-protocol",
    version="0.1.2",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.1",
    ],
    python_requires=">=3.7",
    url="https://github.com/Surfer-Org/Protocol/tree/main/sdk/python",
    license="MIT",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    author="Sahil Lalani",
    author_email="lihas1002@gmail.com",
    description="Python client for the Surfer Protocol desktop app",
    long_description=long_description,
    long_description_content_type="text/markdown",
    keywords="surfer-protocol, client, local-first, ai-agent, ai-agent-framework, langchain, langsmith, streamlit, ollama, vector-database, weaviate, personal-data, personal-data-warehouse",
)