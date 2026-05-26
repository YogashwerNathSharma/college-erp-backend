import devLogo from "../assets/ynlogo.png";

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-white mt-10">

      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">

        {/* LEFT → Developer */}
        <div className="flex flex-col items-start">
          <img
            src={devLogo}
            alt="Developer Logo"
            className="h-20 mb-3"
          />

          <h3 className="font-semibold text-lg">
            Developed by Y.N. Software
          </h3>

          <p className="text-sm opacity-80 mt-2">
            📧 yogashwernathsharma@gmail.com
          </p>

          <p className="text-sm opacity-80 mt-1">
            📞 +91 9627029113
          </p>
        </div>

        {/* CENTER */}
        <div>
          <h3 className="font-semibold mb-3">Our School</h3>
          <p className="text-sm opacity-80">
            RMS Academy provides qualitative education with modern learning methods.
          </p>
        </div>

        {/* RIGHT */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <div className="flex flex-col gap-1 text-sm opacity-80">
            <a href="/">Home</a>
            <a href="/gallery">Gallery</a>
            <a href="/payment">Pay Fees</a>
          </div>
        </div>

      </div>

      <div className="text-center text-xs opacity-60 border-t border-white/10 py-4">
        © 2026 Y.N. Software. All rights reserved.
      </div>

    </footer>
  );
}