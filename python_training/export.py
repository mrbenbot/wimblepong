from typing import Tuple
import subprocess

import torch as th
from stable_baselines3.common.policies import BasePolicy
from stable_baselines3 import PPO
from onnx2tf import convert

from path_master import PathMaster


class OnnxableSB3Policy(th.nn.Module):
    def __init__(self, policy: BasePolicy):
        super().__init__()
        self.policy = policy

    def forward(self, observation: th.Tensor) -> Tuple[th.Tensor, th.Tensor, th.Tensor]:
        # Run the policy in deterministic mode
        actions, values, log_prob = self.policy(observation, deterministic=True)
        return actions


def export_pytorch_to_onnx(model_name: str, model_version: int, pm: PathMaster | None = None):
    if pm is None:
        pm = PathMaster()

    # Load the trained PyTorch model
    model_path = pm.pytorch_model_file(model_name, model_version)

    model = PPO.load(model_path, device="cpu")

    onnx_policy = OnnxableSB3Policy(model.policy)
    onnx_file_path = pm.onnx_model_file(model_name, model_version)

    # Define dummy input based on the observation space shape
    observation_size = model.observation_space.shape
    dummy_input = th.randn(1, *observation_size)

    # Export the model to ONNX
    th.onnx.export(
        onnx_policy,
        dummy_input,
        onnx_file_path,
        opset_version=11,
        input_names=["input"],
        output_names=["actions"]
    )

    print(f"ONNX model saved at: {onnx_file_path}")


def export_onnx_to_tensorflow(model_name: str, model_version: int, pm: PathMaster | None = None):
    if pm is None:
        pm = PathMaster()

    tf_model_path = pm.tensorflow_path(model_name, model_version)
    onnx_file_path = pm.onnx_model_file(model_name, model_version)

    # Convert ONNX to TensorFlow SavedModel
    convert(
        input_onnx_file_path=onnx_file_path,
        output_folder_path=tf_model_path,
        output_signaturedefs=True,
    )

    print(f"TensorFlow SavedModel saved at: {tf_model_path}")


def export_tensorflow_to_tensorflowjs(model_name: str, model_version: int, pm: PathMaster | None = None):
    if pm is None:
        pm = PathMaster()

    tf_model_path = pm.tensorflow_path(model_name, model_version)
    tfjs_model_path = pm.tensorflowjs_path(model_name, model_version)

    # Convert the TensorFlow model to TensorFlow.js
    subprocess.run([
        'tensorflowjs_converter',
        '--input_format', 'tf_saved_model',
        '--output_format', 'tfjs_graph_model',
        "--signature_name", "serving_default",
        tf_model_path,
        tfjs_model_path
    ])

    print(f"TensorFlow.js model saved at: {tfjs_model_path}")


def export_model(model_name: str, model_version: int, pm: PathMaster | None = None):
    export_pytorch_to_onnx(model_name, model_version, pm)
    export_onnx_to_tensorflow(model_name, model_version, pm)
    export_tensorflow_to_tensorflowjs(model_name, model_version, pm)

