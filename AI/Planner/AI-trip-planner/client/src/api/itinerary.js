import axios from "axios";

export const generateItinerary = async ({ userId, destination, days, preferences }) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/itinerary",
      { userId, destination, days, preferences },
      { withCredentials: true }
    );
    return response.data; // JSON itinerary or raw text fallback
  } catch (err) {
    console.error("Itinerary API error:", err.response?.data || err.message);
    return { error: "Failed to generate itinerary" };
  }
};
export default router;