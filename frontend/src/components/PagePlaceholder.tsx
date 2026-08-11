interface Props {
  title: string;
  description: string;
}

/** Used by pages whose real content is built in a later stage. */
export function PagePlaceholder({ title, description }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
