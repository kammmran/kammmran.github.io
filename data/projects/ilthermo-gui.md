## ILThermoPy Data Processing Web Application

The ILThermoPy Data Processing project is a Django-based web application designed to streamline the processing and visualization of data derived from the ILThermoPy library(for future we will develop our own lib with new additivies and use our own db.). Developed with data scientists and researchers in mind, this tool facilitates the retrieval, processing, and export of compound property data, enabling users to efficiently generate and download CSV files containing relevant scientific data.

### Key Features
- **Comprehensive Data Retrieval**: Search for and retrieve compound properties from a vast database with ease.
- **CSV Generation and Download**: Quickly generate and download data in CSV format by simply entering compound details, properties, and additional filters.
- **User-Friendly Interface**: Navigate through a clean and intuitive interface, optimized for data search and export tasks.
- **Docker Compatibility**: Deploy seamlessly with Docker for consistent performance across environments.

### Technical Specifications
The application is built with Django and powered by Python libraries such as Pandas, Numpy, and ILThermoPy. Its robust backend supports both local and cloud deployment, thanks to integration with PostgreSQL and Django-Heroku.

### Installation and Use
The ILThermoPy application is easily set up via GitHub. After cloning the repository, users can install dependencies, run the server, and access the tool through their browser. Full installation and usage instructions are available within the project’s documentation on GitHub.

This tool is open-source and available under the MIT License, inviting contributions from the community to further enhance its functionality.
```mermaid
flowchart LR
    A[ILTHERMO Database by NIST] --> B[ILThermoPy Python Module]
    B --> C[ILTHERMO GUI]
```