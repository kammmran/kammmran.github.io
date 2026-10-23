[Code](https://github.com/sbaybekov/qspr-il-density-refractive-index) | [App](https://qspr-il-density-refractive-index.streamlit.app/) | [Docs](https://ilqspr.readthedocs.io/en/latest/)

ILQSPR predicts the **density** and **refractive index** of ionic liquids, both pure and in binary mixtures with water, ethanol and isopropanol, as a function of temperature and IL mole fraction. Joint work with Dr. Shamkhal Baybekov.

## How it works

- **Data:** curated from the NIST ILThermo database with [pyionics](https://pypi.org/project/pyionics/), with duplicate removal, consistency checks and structure standardisation.
- **Descriptors:** Mordred 2D descriptors computed separately for the cation and anion, then variance- and correlation-based feature selection.
- **Models:** consensus ensembles of five XGBoost models, validated with group-based 5-fold cross-validation on IL SMILES. R² = 0.90-0.96 across all eight property-solvent systems.

## Use it

The models run in a public Streamlit app. Enter SMILES, temperature and composition, and get a prediction. No coding needed.

Manuscript in preparation.
