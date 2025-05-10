"use client";

import { useState } from "react";
import Papa from "papaparse";

export default function Home() {
  const [data, setData] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [process, setProcess] = useState({});

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
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4 text-center">
        SPK Pemberian Reward (Entropy + WASPAS)
      </h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleCSV}
        className="mb-4 border border-gray-300 rounded px-4 py-2"
      />

      {ranking.length > 0 && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-lg font-semibold mb-4 text-center">
            Hasil Ranking:
          </h2>
          <table className="table-auto w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-black">
                <th className="border border-gray-300 px-4 py-2">Nama</th>
                <th className="border border-gray-300 px-4 py-2">Skor</th>
                <th className="border border-gray-300 px-4 py-2">Ranking</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={i} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">{r.name}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {r.score.toFixed(4)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{i + 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {process.normalized && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-lg font-semibold mb-4 text-center">
            Proses Perhitungan:
          </h2>

          <h3 className="font-semibold mt-4 mb-1">Normalisasi Matrix:</h3>
          <table className="table-auto w-full border border-gray-300 text-sm">
            <tbody>
              {process.normalized.map((row, i) => (
                <tr key={i}>
                  {row.map((val, j) => (
                    <td key={j} className="border border-gray-300 px-2 py-1">
                      {val.toFixed(4)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="font-semibold mt-4 mb-1">Bobot (Entropy):</h3>
          <div className="flex gap-2 flex-wrap">
            {process.weights.map((w, i) => (
              <div
                key={i}
                className="px-2 py-1 border border-gray-300 rounded text-sm">
                K{i + 1}: {w.toFixed(4)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
