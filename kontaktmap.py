import os

from flask import Flask, render_template, request, json

app = Flask(__name__)

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/save', methods=['POST'])
def save():
	with open('data.json', 'w+') as f:
		f.write(json.dumps(request.get_json()))

	return ''

@app.route('/load')
def load():
	result = '{ "markers": [] }'

	if os.path.isfile('data.json'):
		with open('data.json', 'r') as f:
			result = f.read()

	return json.jsonify(result)

if __name__ == '__main__':
	app.run()
