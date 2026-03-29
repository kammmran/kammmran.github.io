

## Installation

```bash
pip install ILpyTHERMO
```

## Features

- Fetch data from ILThermo database
- Process and standardize data formats
- Handle SMILES data for compounds
- Parallel processing capabilities
- Export to CSV format
- Utilities for data cleanup and standardization

## Quick Start

```python
from ILpyTHERMO import DataFetcher, DataProcessor

# Initialize the data fetcher
fetcher = DataFetcher()

# Get density data
data = fetcher.get_property_data(property_id="JkYu")

# Process the data
processor = DataProcessor()
processor.load_json(data).standardize_columns().to_csv("output.csv")
```

## Advanced Usage

### Working with SMILES Data

```python
# Get SMILES data for compounds
compounds = fetcher.get_compound_data(compound_ids=['1', '2'], compounds_csv_path='compounds.csv')
```

### Parallel Processing

```python
# Process multiple files in parallel
processor.process_files_parallel(json_files=['file1.json', 'file2.json'], output_prefix='processed_')
```

## Requirements

- Python >=3.7
- pandas >=1.0.0
- requests >=2.25.0
- tqdm >=4.0.0

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.