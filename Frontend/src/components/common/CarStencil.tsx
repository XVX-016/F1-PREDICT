export default function CarStencil({ className = "w-24 h-8" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 30"
            fill="currentColor"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M15 12h-8c-2 0 -3 1 -3 3v5h2v-2h2v2h3v-2h5l2 -5h2l2 5h10l-2 -6h5l2 6h12l-2 -6h10l2 6h5v-5h-3v-5c0 -2 -1 -3 -3 -3h-10l-5 5h-15l-5 -5z M25 21a3 3 0 1 0 0 6 3 3 0 0 0 0 -6 M75 21a3 3 0 1 0 0 6 3 3 0 0 0 0 -6" />
            <path d="M25 24a1 1 0 1 1 0 2 1 1 0 0 1 0 -2 M75 24a1 1 0 1 1 0 2 1 1 0 0 1 0 -2" fill="#fff" fillOpacity="0.2" />
        </svg>
    );
}
