# Guide for training your AI contender with pytorch

This directory contains a [python jupyter notebook](./WimblepongCustomTrainingEnv.ipynb) which you can use to train a model. You can run this notebook using google colab or you can run in locally - it's up to you.

## To run in colab

Go to the [notebook](./WimblepongCustomTrainingEnv.ipynb) and click open in colab.

## To run locally

### 1) Create a virtual environment

I prefer venv, bash, and Linux, you can try Conda, Windows, Powershell if you'd like life to be unnecessarily complicated..

```bash
cd ai_training
python -m venv venv
. venv/bin/activate
```

### 2) Install the requirements

```bash
pip install -r requirements.txt
```

### 3) fire up Jupyter Lab

```bash
jupyter lab
```

Enjoy :)
