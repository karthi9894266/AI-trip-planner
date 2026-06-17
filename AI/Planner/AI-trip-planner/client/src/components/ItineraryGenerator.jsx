import { useState } from "react";
import { generateItinerary } from "../api/itinerary";

const ItineraryGenerator = ({ userId }) => {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [preferences, setPreferences] = useState("");
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateItinerary({ userId, destination, days, preferences });
    setLoading(false);
    setItinerary(result);
  };

  return (
    <div>
      <input placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} />
      <input type="number" value={days} onChange={(e) => setDays(e.target.value)} />
      <input placeholder="Preferences" value={preferences} onChange={(e) => setPreferences(e.target.value)} />
      <button onClick={handleGenerate}>Generate Itinerary</button>

      {loading && <div>Generating itinerary...</div>}

      {itinerary && (
        <pre>{typeof itinerary === "object" ? JSON.stringify(itinerary, null, 2) : itinerary.raw}</pre>
      )}
    </div>
  );
};

export default ItineraryGenerator;
