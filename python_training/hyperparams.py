"""
The different hyper parameter tuning options
"""
from typing import Any
import random


# Hyperparameters for PPO
def default_hyperparams() -> dict[str, Any]:
    return {
        'n_steps': 2048,
        'batch_size': 64,  # Try a smaller batch size for more frequent updates
        'n_epochs': 4,  # Fewer epochs to reduce overfitting to on-policy data
        'gamma': 0.99,  # Slightly higher discount factor to consider more future rewards
        'gae_lambda': 0.95,
        'clip_range': 0.2,
        'clip_range_vf': 0.2,
        'ent_coef': 0.001,
        'vf_coef': 0.5,
        'max_grad_norm': 0.5,
        'target_kl': 0.01,
        'tensorboard_log': None
    }


def random_entropy() -> dict[str, Any]:
    params = default_hyperparams()
    params['ent_coef'] = random.uniform(0.1, 0.0005)
    return params


def more_entropy() -> dict[str, Any]:
    params = default_hyperparams()
    params['ent_coef'] = 0.1
    return params


def bry_params_1() -> dict[str, Any]:
    params = default_hyperparams()
    params['batch_size'] = 64
    params['n_steps'] = 8192
    return params
