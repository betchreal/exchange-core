import { FormEvent, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { FileUpload } from "./ui/FileUpload";
import { api } from "@/lib/axios";
import { InlineError } from "@/components/ui/InlineError";
import { PluginType } from "@exchange-core/common";

interface InstallPluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  pluginType: PluginType;
  onSuccess?: () => void;
}

const pluginTypeLabels: Record<PluginType, string> = {
  payout: "Payout",
  merchant: "Merchant",
  parser: "Parser",
  aml: "AML",
};

const pluginTypeEndpoints: Record<PluginType, string> = {
  payout: "/payout/install",
  merchant: "/merchant/install",
  parser: "/parser/install",
  aml: "/aml/install",
};

export function InstallPluginModal({
  isOpen,
  onClose,
  pluginType,
  onSuccess,
}: InstallPluginModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = pluginTypeEndpoints[pluginType];
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to install plugin";
      setError(Array.isArray(msg) ? msg.join("\n") : msg);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Boolean(file);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Install ${pluginTypeLabels[pluginType]} Plugin`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FileUpload
          file={file}
          onFileChange={setFile}
          accept=".tgz,.tar.gz"
          label="Plugin Archive (.tgz)"
        />

        {error && <InlineError message={error} />}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!isFormValid} loading={loading}>
            Install
          </Button>
        </div>
      </form>
    </Modal>
  );
}
