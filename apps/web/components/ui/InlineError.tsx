type InlineErrorProps = {
  message: string;
};

export function InlineError({ message }: InlineErrorProps) {
  return (
    <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}
