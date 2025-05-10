"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { MdOutlineLightMode } from "react-icons/md";
import { MdLightMode } from "react-icons/md";

export default function Home() {
  const [data, setData] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [process, setProcess] = useState({});
  const [darkMode, setDarkMode] = useState(false);

  // Ambil preferensi darkmode dari localStorage
  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("darkMode", newMode);
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (result) {
        setData(result.data);
        const { ranking, process } = calculateRanking(result.data);
        setRanking(ranking);
        setProcess(process);
      },
    });
  };

  const calculateRanking = (data) => {
    const criteria = Object.keys(data[0]).slice(1);
    const matrix = data.map((d) => criteria.map((k) => parseFloat(d[k])));
    const normalized = normalizeMatrix(matrix);
    const weights = calculateEntropy(normalized);
    const scores = calculateWaspas(normalized, weights);

    const ranking = data
      .map((d, i) => ({
        name: d[Object.keys(d)[0]],
        score: scores[i],
      }))
      .sort((a, b) => b.score - a.score);

    return { ranking, process: { matrix, normalized, weights, scores } };
  };

  const normalizeMatrix = (matrix) => {
    const transpose = matrix[0].map((_, i) => matrix.map((row) => row[i]));
    const max = transpose.map((col) => Math.max(...col));
    return matrix.map((row) => row.map((v, i) => v / max[i]));
  };

  const calculateEntropy = (normalized) => {
    const k = 1 / Math.log(normalized.length);
    const transpose = normalized[0].map((_, i) =>
      normalized.map((row) => row[i])
    );
    const entropies = transpose.map((col) => {
      const sum = col.reduce(
        (acc, val) => acc + (val === 0 ? 0 : val * Math.log(val)),
        0
      );
      return -k * sum;
    });
    const d = entropies.map((e) => 1 - e);
    const total = d.reduce((a, b) => a + b, 0);
    return d.map((v) => v / total);
  };

  const calculateWaspas = (normalized, weights) => {
    return normalized.map((row) => {
      const wsm = row.reduce((acc, val, i) => acc + val * weights[i], 0);
      const wpm = row.reduce(
        (acc, val, i) => acc * Math.pow(val, weights[i]),
        1
      );
      return 0.5 * wsm + 0.5 * wpm;
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-white text-black dark:bg-gray-900 dark:text-white transition-all duration-300 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-center">
          SPK Reward (Entropy + WASPAS)
        </h1>
      </div>

      {/* Dark Mode Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-4 right-4 bg-gray-300 dark:bg-gray-700 text-sm px-3 py-1 rounded-md shadow-lg">
        {darkMode ? <MdOutlineLightMode /> : <MdLightMode />}
      </button>

      {/* Upload */}
      <input
        type="file"
        accept=".csv"
        onChange={handleCSV}
        className="mb-6 block w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded px-4 py-2 bg-white dark:bg-gray-800 text-center"
      />

      {/* Ranking */}
      {ranking.length > 0 && (
        <div className="overflow-x-auto max-w-full text-center">
          <h2 className="text-lg font-semibold mb-2">Hasil Ranking</h2>
          <table className="table-auto border border-gray-400 dark:border-gray-600 text-sm sm:text-base mx-auto">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-black dark:text-white">
                <th className="border px-4 py-2">Nama</th>
                <th className="border px-4 py-2">Skor</th>
                <th className="border px-4 py-2">Ranking</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={i} className="text-center">
                  <td className="border px-4 py-1">{r.name}</td>
                  <td className="border px-4 py-1">{r.score.toFixed(4)}</td>
                  <td className="border px-4 py-1">{i + 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Proses */}
      {process.normalized && (
        <div className="mt-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Proses Perhitungan</h2>

          {/* Normalisasi */}
          <h3 className="font-semibold mt-4 mb-1">Normalisasi Matriks</h3>
          <div className="overflow-x-auto">
            <table className="table-auto border border-gray-400 dark:border-gray-600 text-xs sm:text-sm mx-auto">
              <tbody>
                {process.normalized.map((row, i) => (
                  <tr key={i}>
                    {row.map((val, j) => (
                      <td key={j} className="border px-2 py-1">
                        {val.toFixed(4)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bobot */}
          <h3 className="font-semibold mt-4 mb-1">Bobot Entropy</h3>
          <div className="flex gap-2 flex-wrap justify-center">
            {process.weights.map((w, i) => (
              <div
                key={i}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm">
                K{i + 1}: {w.toFixed(4)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
