
const sendJSONResponse = (res, status, content) => {
	if (!res) { return; };

	res.status(status);
	res.json(content);

	if (status != 200 && status != 201) {
		console.error('HTTP error status: ', status, content.message);
	}
};

module.exports = {
    sendJSONResponse
}