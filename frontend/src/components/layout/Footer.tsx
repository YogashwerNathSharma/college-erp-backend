//////////////////////////////////////////////////////
// 📄 FOOTER COMPONENT
//////////////////////////////////////////////////////

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
        <p>© {year} College ERP. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <a href="/docs" className="hover:text-indigo-600 transition">Documentation</a>
          <a href="/support" className="hover:text-indigo-600 transition">Support</a>
          <span className="text-gray-300">|</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
