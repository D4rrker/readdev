import { useState } from 'react';

interface Props {
  codeRaw: string;
}

export default function CopyButton({ codeRaw }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(codeRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={`w-20 cursor-pointer rounded border px-2.5 py-1 text-center font-mono text-[11px] transition-colors ${
        copied
          ? 'border-[#c97d4e] text-[#c97d4e]'
          : 'border-[#2a2d38] text-[#4a4a52] hover:border-[#c97d4e] hover:text-[#c97d4e]'
      }`}
    >
      {copied ? '✓ copiado' : 'copiar'}
    </button>
  );
}
