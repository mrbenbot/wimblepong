"""
This provides a class that manages paths for model and log files
"""
from pathlib import Path

def _mount_colab_drive() -> str | None:
    try:
        from google.colab import drive
        drive.mount('/content/drive')
        result = "/content/drive/MyDrive/wimblepong"
    except:
        result = None
    return result 


class PathMaster:
    def __init__(self, base_path: str | None = None):

        if base_path is None:
            base_path = _mount_colab_drive()

        if base_path is None:
            base_path = "./models"

        if not base_path.endswith("/"):
            base_path += "/"

        p = Path(base_path)
        p.mkdir(parents=True, exist_ok=True)

        self.base_path = base_path

    def _model_full_path(self, model_name: str, version: int):
        return f"{self.base_path}{model_name}-{version:03d}/"

    def _model_version_exists(self, model_name: str, version: int):
        full_path = self._model_full_path(model_name, version)
        p = Path(full_path)
        return p.is_dir()

    def find_next_model_version(self, model_name: str):
        """
        Returns the latest model version as an integer
        """
        model_version = 0 
        while self._model_version_exists(model_name, model_version):
            model_version += 1 

        return model_version 

    def new_model_version(self, model_name: str) -> int: 
        """
        In the base_path, create a model folder that does not already exist and return it
        naming format is base_path/model_name-000/
        """
        version = self.find_next_model_version(model_name)
        target_path = self._model_full_path(model_name, version)
        p = Path(target_path)
        p.mkdir(parents=True, exist_ok=False)
        return version

    def latest_model_version(self, model_name: str) -> int | None:
        """
        Return the latest version of a given model 
        """
        version = self.find_next_model_version(model_name)
        if 0 < version: 
            version -= 1
        else:
            version = None
        return version 

    def _subfolder(self, model_name: str, model_version: int, subfolder: str) -> str:
        base_path = self._model_full_path(model_name, model_version)
        result = f"{base_path}{subfolder}"
        p = Path(result)
        p.mkdir(parents=True, exist_ok=True)
        return result

    def tensorboard_log_path(self, phase: str | None = None) -> str:
        result = f"{self.base_path}tensorboard"
        if phase is not None: 
            result += f"/{phase}"
        p = Path(result)
        p.mkdir(parents=True, exist_ok=True)
        return result

    def pytorch_model_file(self, model_name: str, model_version: int) -> str:
        folder = self._subfolder(model_name, model_version, "pytorch")
        result = f"{folder}/pytorch.model"
        return result

    def onnx_model_file(self, model_name: str, model_version: int) -> str:
        folder = self._subfolder(model_name, model_version, "onnx")
        result = f"{folder}/onnx.model"
        return result

    def pytorch_training_environment_file(self, model_name: str, model_version: int) -> str:
        folder = self._subfolder(model_name, model_version, "pytorch")
        result = f"{folder}/training.environment"
        return result

    def pytorch_intermediate_best_model_path(self, model_name: str, model_version: int) -> str:
        return self._subfolder(model_name, model_version, "pytorch_best_so_far")

    def tensorflow_path(self, model_name: str, model_version: int) -> str:
        return self._subfolder(model_name, model_version, "tensorflow")

    def tensorflowjs_path(self, model_name: str, model_version: int) -> str:
        return self._subfolder(model_name, model_version, "tensorflowjs")

    def pytorch_training_logs_path(self, model_name: str, model_version: int) -> str:
        return self._subfolder(model_name, model_version, "pytorch_logs")

    def hyperparameter_file(self, model_name: str, model_version: int) -> str:
        folder = self._subfolder(model_name, model_version, "hyperparams")
        result = f"{folder}/hyperparams.json"
        return result



