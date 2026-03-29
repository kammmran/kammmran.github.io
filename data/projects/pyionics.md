## Installation

```bash
pip install pyionics
```
## About package 
This package is a specialized tool for downloading datasets from [ilthermo.org](https://ilthermo.boulder.nist.gov/), converting them to CSV or TSV files, merging datasets, and adding SMILES information to your data.

## Why you should use this package?
1. property ids update for each updating of [ilthermo.org](https://ilthermo.boulder.nist.gov/) site 
2. Converting csv and tsv
3. adding smiles
4. clean dirty json data for converting to other formats
5. merge datasets
## Usage

First, import the library in your Python code:

```python
import pyionics as pyi
```

### Retrieve Idsets Data

Use the `getIdsets` function to retrieve data:

```python
pyi.getIdsets(
    prop="",          # property short name (e.g., 'dens')
    data_path=None,   # optional: path to your data
    cmp="",           # component name (e.g., 'benzene')
    ncmp="0",         # component number: 0=all, 1=pure, 2=binary, 3=triple
    year="",          # publish year
    auth="",          # author name
    keyw=""           # keyword
)
```

#### getIdsets Parameters

| Parameter | Description         | Example      |
|-----------|---------------------|-------------|
| prop      | Property short name | dens        |
| cmp       | Component name      | benzene     |
| ncmp      | Component number    | 1, 2, 3     |
| year      | Publish year        | 2020        |
| auth      | Author name         | Smith       |
| keyw      | Keyword             | ionic       |

- **prop**: Use the short version of the property name (see below).
- **ncmp**: `0` = all, `1` = pure, `2` = binary, `3` = triple.

### Retrieve Datasets

Use the `getData` function to retrieve specific datasets.  
When you call `getData`, it will collect all datasets matching your criteria (using `getIdsets` internally) and save them as JSON files in a newly created `data` folder in your working directory.

```python
pyi.getData(
    prop=None,        # property short name (e.g., 'dens')
    data_path=None,   # optional: path to your data
    cmp="",           # component name (e.g., 'benzene')
    ncmp="0",         # component number: 0=all, 1=pure, 2=binary, 3=triple
    year="",          # publish year
    auth="",          # author name
    keyw=""           # keyword
)
```

> **Note:** `getData` has the same parameters as `getIdsets`. See the table above for details.

## Property List

Only short versions of property names are available for the `getIdsets` and `getData` functions.

When you use `getIdsets`, the results are saved as a JSON file in a newly created `data` folder in your working directory. The output file is named `{prop}_idsets_{other parameters}.json`, where `{prop}` is the short property name and `{other parameters}` reflect your query criteria. The short property names correspond to those used in [pyILT2](http://wgserve.de/pyilt2/props.html).

| Property Name                                               | ID    | Short  |
|-------------------------------------------------------------|-------|--------|
| activity                                                    | BPpY  | a      |
| osmotic-coefficient                                         | VjHv  | phi    |
| composition-at-phase-equilibrium                            | dNip  | Xpeq   |
| eutectic-composition                                        | MbEq  | Xeut   |
| henrys-law-constant                                         | lIUh  | Hc     |
| ostwald-coefficient                                         | eCTp  | L      |
| tieline                                                     | neae  | tline  |
| upper-consolute-composition                                 | WbZo  | Xucon  |
| critical-pressure                                           | BPNz  | Pc     |
| critical-temperature                                        | rDNz  | Tc     |
| lower-consolute-temperature                                 | qpSz  |        |
| upper-consolute-pressure                                    | MvMG  | Pucon  |
| upper-consolute-temperature                                 | bRXE  | Tucon  |
| apparent-enthalpy                                           | cpbY  | Hap    |
| apparent-molar-heat-capacity                                | teHk  | capm   |
| enthalpy-of-dilution                                        | rTYh  | Hdil   |
| enthalpy-of-mixing-of-a-binary-solvent-with-component       | aeiA  | Hmix   |
| enthalpy-of-solution                                        | VTiT  |        |
| excess-enthalpy                                             | brzp  | Hex    |
| partial-molar-enthalpy                                      | Sqxi  | Hpm    |
| partial-molar-heat-capacity                                 | mFmK  |        |
| enthalpy                                                    | tnYd  | H      |
| enthalpy-function                                           | kthO  | HvT    |
| entropy                                                     | qdUt  | S      |
| heat-capacity-at-constant-pressure                          | IZSt  | cp     |
| heat-capacity-at-constant-volume                            | KvgF  | cv     |
| heat-capacity-at-vapor-saturation-pressure                  | zJIE  | cpe    |
| enthalpy-of-transition-or-fusion                            | CXUw  | Hfus   |
| enthalpy-of-vaporization-or-sublimation                     | iaOF  | Hvap   |
| equilibrium-pressure                                        | SwyC  | Peq    |
| equilibrium-temperature                                     | ghKa  | Teq    |
| eutectic-temperature                                        | lnrs  | Teut   |
| monotectic-temperature                                      | LUaF  | Tmot   |
| normal-melting-temperature                                  | NmYB  | Tm     |
| interfacial-tension                                         | YQDr  | s      |
| refractive-index                                            | bNnk  | n      |
| relative-permittivity                                       | imdq  | rperm  |
| speed-of-sound                                              | NlQd  | sos    |
| surface-tension-liquid-gas                                  | ETUw  | slg    |
| binary-diffusion-coefficient                                | HooV  |        |
| electrical-conductivity                                     | Ylwl  | econd  |
| self-diffusion-coefficient                                  | jjnq  | Dself  |
| thermal-conductivity                                        | pAFI  | Tcond  |
| thermal-diffusivity                                         | KTcm  | Dterm  |
| tracer-diffusion-coefficient                                | vBeU  | Dtrac  |
| viscosity                                                   | PusA  | visc   |
| normal-boiling-temperature                                  | hkog  | Tb     |
| vapor-or-sublimation-pressure                               | HwfJ  |        |
| adiabatic-compressibility                                   | WxCH  | kS     |
| apparent-molar-volume                                       | zNjL  | Vapm   |
| density                                                     | JkYu  | dens   |
| excess-volume                                               | psRu  | Vex    |
| isobaric-coefficient-of-volume-expansion                    | hXfd  | aV     |
| isothermal-compressibility                                  | Bvon  | kT     |
| partial-molar-volume                                        | LNxL  | Vpm    |


## Convert Functions

After retrieving datasets with an idsets request, the data is saved as a JSON file. The pyionics library provides functions to convert these JSON files to CSV or TSV formats using `convert2csv` and `convert2tsv`. Note that merging datasets and adding SMILES information require the data to be in CSV format.

Just write the folder name located inside the `data` folder; do not include `data` as the parent directory.To convert files, use the following functions:

Convert to CSV:
```python
    pyi.convert2csv(folder_name='', file_name='')
    # Converts a JSON file to CSV format
    # Only one of the parameters (`folder_name` or `file_name`) is required.
```

Convert to TSV:
```python
    pyi.convert2tsv(folder_name='', file_name='')
    # Converts a JSON file to TSV format
    # Only one of the parameters (`folder_name` or `file_name`) is required.
```


## Add SMILES
Note : `getSmiles` function runs just csv files. Also for folder_name parameter it shoud start with csv_ (other case function do not works right). 

```python
    pyi.addSmiles(folder_name='', file_name='')
```

## Merge datasets
`MergeFIles` is function to merge datasets in folder

```python
    pyi.mergeFiles(folder_name)
```