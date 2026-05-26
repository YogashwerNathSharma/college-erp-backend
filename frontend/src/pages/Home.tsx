import { Link } from "react-router-dom";
import schoolBg from "../assets/school-bg.png";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div>

      <Header />

      {/* HERO */}
      <section className="mt-6 mx-4 rounded-2xl overflow-hidden shadow-xl relative">

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${schoolBg})` }}
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative text-center text-white py-32 px-4">

          <h1 className="text-5xl font-bold text-white drop-shadow-2xl">
  RMS Academy
</h1>

          <p className="mt-3 text-lg opacity-90">
            Divna Road Parora Meerganj, Bareilly
          </p>

          <p className="mt-4 opacity-80">
            Building tomorrow’s leaders through qualitative education.
          </p>

          <div className="mt-6 flex justify-center gap-4">
            <Link to="/payment">
              <button className="bg-white text-black px-6 py-3 rounded-lg shadow-md">
                Pay School Fees
              </button>
            </Link>

            <Link to="/gallery">
              <button className="border border-white px-6 py-3 rounded-lg">
                View Gallery
              </button>
            </Link>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-6">

        {[
          "Quality Education",
          "Modern Curriculum",
          "Caring Faculty",
          "Community",
        ].map((item) => (
          <div key={item} className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-3" />
            <h3 className="font-semibold">{item}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Description text here
            </p>
          </div>
        ))}

      </section>

      {/* CTA */}
     <section className="bg-blue-600 text-white py-12">
  <div className="max-w-6xl mx-auto px-4 text-center">

    <h2 className="text-2xl md:text-3xl font-bold">
      Pay School Fees Online
    </h2>

    <p className="mt-2 opacity-90">
      Quick, secure, and instant receipt system.
    </p>

    <Link to="/payment">
      <button className="mt-5 bg-white text-blue-600 px-6 py-2 rounded-lg font-medium shadow">
        Make Payment
      </button>
    </Link>

  </div>
</section>
      <Footer />

    </div>
  );
}