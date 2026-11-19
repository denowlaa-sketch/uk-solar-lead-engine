type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#f4f1e8]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[#c9cebf]">{description}</p>}
      </div>
      {children}
    </div>
  );
}
