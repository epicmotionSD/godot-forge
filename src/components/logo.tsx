export function LogoMark({ size = 32 }: { size?: number }) {
  const inner = Math.round(size * 0.65);
  return (
    <div
      className="rounded-lg shrink-0 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #4d8fcc, #e05572)",
      }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Faceted gem — outer shape */}
        <path
          d="M7 3H17L22 11L12 22L2 11Z"
          fill="white"
          fillOpacity="0.15"
          stroke="white"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Horizontal girdle */}
        <line x1="2" y1="11" x2="22" y2="11" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        {/* Left crown facet */}
        <line x1="7" y1="3" x2="12" y2="11" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        {/* Right crown facet */}
        <line x1="17" y1="3" x2="12" y2="11" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}
