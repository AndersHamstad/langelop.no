export default function Shop() {
  return (
    <div className="bg-gray-100 flex items-center justify-center px-4 min-h-screen">
      <div className="text-center max-w-md">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
        👷‍♂️ 🏗️ 👷‍♀️
        </h1>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
         Nettbutikken er under arbeid 
        </h1>
        <p className="text-base md:text-lg text-gray-600">
          Kommer snart… 
        </p>
      </div>
    </div>
  );
}

Shop.hideFooter = true;
