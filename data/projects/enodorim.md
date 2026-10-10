Interactive simulator of human olfaction: an odorant reaches the nose, binds odorant receptors, the sensory neurons fire, the olfactory bulb integrates the signal, and the cortex decodes it into a conscious smell.

Site: [kammmran.github.io/ENodorIM](https://kammmran.github.io/ENodorIM/#/) &middot; Code: [github.com/kammmran/ENodorIM](https://github.com/kammmran/ENodorIM)

Part of a research project on predicting the fragrance of chemical mixtures, with the DIFACQUIM group at the School of Chemistry, UNAM.

## What it does

The centre of the project is the receptor step. Which of the ~400 human odorant receptors respond comes from measured cell-assay data (M2OR); every later stage shows what that activation pattern leads to. Every value on screen is labelled `measured`, `predicted` or `schematic`.

- **Simulate:** pick a test odorant, set the concentration, watch the full chain and inspect each receptor.
- **Draw a molecule:** sketch or paste any structure and get a predicted receptor pattern and predicted odour words, with the measured molecules behind each prediction shown as evidence.
- **Mixtures:** combine two or more odorants, including a drawn one. Components compete for one binding site per receptor, so a mixture collapses to a single effective EC50 and runs through the same simulation.
- **Export:** every computed pattern downloads as CSV or JSON with all 432 receptors, the concentration, the genotype and the provenance of each value. Untested receptors export as empty or `null`, never as `0`.
- **Shareable links:** the odorant, concentration, genotype and mixture are encoded in the URL hash, so an exact view can be sent to a colleague or cited.

## The prediction model

Two predictors are shipped side by side and compared on identical folds. The baseline is similarity-based: Morgan fingerprints (radius 2, 2048 bits, chirality included, because the measured data show enantiomers activating receptors differently) scored by Tanimoto similarity against 654 measured molecules and 3,522 molecules with expert odour labels. The learned model fits a per-receptor L2 logistic regression for the 31 receptors with enough measured molecules on both sides.

| | learned | neighbours |
|---|---|---|
| Mean ROC-AUC | 0.691 | 0.677 |
| Mean average precision | 0.422 | 0.380 |
| Better on | 22 of 31 receptors | 9 |

Random forests, extra trees and SVMs all came within 0.01 AUC, so the data is the limit rather than the algorithm. Per-receptor AUC varies a lot (OR5AN1 reaches 0.98, several sit at chance), so every prediction carries its own receptor AUC and the simulation uses the learned score only above AUC 0.70.

## How it is built

A Python pipeline pulls M2OR, HGNC, UniProt, GPCRdb, AlphaFold DB, RCSB PDB, PubChem, Pyrfume and Crossref, resolves gene-name spellings to HGNC symbols, builds one consensus result per receptor-odorant pair, and writes committed JSON. Contradictory pairs are kept as `inconclusive` with the reason instead of being dropped.

The front end is TypeScript and React with SVG scenes per stage. The simulation lives in a separate pure-TypeScript model layer that never imports from the interface, so it is unit-tested and reusable on its own: Hill activation, a kinetic single-neuron model (cAMP, Ca2+, Cl-, Vm, spikes), glomerular layout with lateral inhibition, and documented per-person modifiers. The output is a static site with a relative base, deployed to GitHub Pages.

## Limits it states openly

Cell-assay data show which receptors can respond, not what happens in a living nose. Most human receptors have no known ligand, so "not tested" and "does not respond" are shown as different states. Assay concentrations are not nasal concentrations. Transduction timings are mostly from rodents. The glomerular map and the brain activity levels are schematic. Mixture suppression and masking are not modelled.

The Leffingwell descriptor set is CC BY-NC, so any published copy of the site stays non-commercial.
