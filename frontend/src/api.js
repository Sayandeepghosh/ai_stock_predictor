import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const searchStocks = async (query) => {
    try {
        const response = await axios.get(`${API_URL}/search?query=${query}`);
        return response.data;
    } catch (error) {
        console.error("Error searching stocks:", error);
        return [];
    }
};

export const getPrediction = async (symbol) => {
    try {
        const response = await axios.get(`${API_URL}/predict/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching prediction:", error);
        throw error.response ? error.response.data.detail : error;
    }
};
