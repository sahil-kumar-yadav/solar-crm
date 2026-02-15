"use client";

import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    zipCode: "",
    state: "",
    monthlyElectricBill: "",
    propertyType: "residential",
    homeOwner: true,
    financing: "unknown",
    roofType: "asphalt",
    creditRange: "",
    utilityId: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create lead");
        return;
      }

      setResult(data.lead);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        zipCode: "",
        state: "",
        monthlyElectricBill: "",
        propertyType: "residential",
        homeOwner: true,
        financing: "unknown",
        roofType: "asphalt",
        creditRange: "",
        utilityId: "",
        notes: "",
      });
    } catch (err) {
      setError("Network error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ☀️ SolarOS CRM Core Engine
          </h1>
          <p className="text-lg text-gray-600">
            Deterministic lead qualification and solar proposal generation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Entry Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                New Lead Entry
              </h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                  {error}
                </div>
              )}

              {/* Personal Information */}
              <fieldset className="mb-8">
                <legend className="text-lg font-semibold text-gray-700 mb-4">
                  Personal Information
                </legend>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </fieldset>

              {/* Property Information */}
              <fieldset className="mb-8">
                <legend className="text-lg font-semibold text-gray-700 mb-4">
                  Property Information
                </legend>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZIP Code"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select State</option>
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="NY">New York</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="non-profit">Non-profit</option>
                  </select>
                  <select
                    name="roofType"
                    value={formData.roofType}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="asphalt">Asphalt</option>
                    <option value="metal">Metal</option>
                    <option value="tile">Tile</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>
                <label className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    name="homeOwner"
                    checked={formData.homeOwner}
                    onChange={handleChange}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">Home Owner</span>
                </label>
              </fieldset>

              {/* Financial Information */}
              <fieldset className="mb-8">
                <legend className="text-lg font-semibold text-gray-700 mb-4">
                  Financial Information
                </legend>
                <input
                  type="number"
                  name="monthlyElectricBill"
                  placeholder="Monthly Electric Bill ($)"
                  value={formData.monthlyElectricBill}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="financing"
                    value={formData.financing}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="unknown">Financing Unknown</option>
                    <option value="cash">Cash</option>
                    <option value="loan">Loan</option>
                    <option value="lease">Lease</option>
                  </select>
                  <select
                    name="creditRange"
                    value={formData.creditRange}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Credit Range</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </fieldset>

              {/* Utility and Notes */}
              <fieldset className="mb-8">
                <legend className="text-lg font-semibold text-gray-700 mb-4">
                  Additional Information
                </legend>
                <select
                  name="utilityId"
                  value={formData.utilityId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                >
                  <option value="">Select Utility Provider</option>
                  <option value="demo-pge">Pacific Gas & Electric (CA)</option>
                  <option value="demo-sce">Southern California Edison</option>
                  <option value="demo-ercot">ERCOT (TX)</option>
                </select>
                <textarea
                  name="notes"
                  placeholder="Additional Notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </fieldset>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? "Creating Lead..." : "Create Lead"}
              </button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1">
            {result ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Lead Created! ✓
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Lead Score</p>
                    <p className="text-2xl font-bold">
                      <span
                        className={
                          result.score === "hot"
                            ? "text-red-600"
                            : result.score === "warm"
                              ? "text-orange-600"
                              : "text-blue-600"
                        }
                      >
                        {result.score.toUpperCase()}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Next Action</p>
                    <p className="text-gray-900 font-medium">
                      {result.nextAction
                        .replace(/_/g, " ")
                        .toUpperCase()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Reason</p>
                    <p className="text-sm text-gray-700">
                      {result.scoring.reason}
                    </p>
                  </div>

                  {result.scoring.objections.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">
                        Objections Found
                      </p>
                      <div className="space-y-2 mt-2">
                        {result.scoring.objections.map(
                          (objection: string) => (
                            <div
                              key={objection}
                              className="text-sm bg-amber-50 border border-amber-200 rounded p-2"
                            >
                              <p className="font-semibold text-amber-900">
                                {objection.replace(/_/g, " ")}
                              </p>
                              <p className="text-amber-700 text-xs mt-1">
                                {
                                  result.scoring.rebuttals[objection]
                                }
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">Territory</p>
                    <p className="text-gray-900">
                      {result.territory || "Unassigned"}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => setResult(null)}
                      className="w-full bg-gray-200 text-gray-900 font-semibold py-2 rounded hover:bg-gray-300 transition"
                    >
                      Create Another Lead
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
                <p className="text-sm text-blue-700">
                  💡 Fill out the form to generate a lead with automatic scoring
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
