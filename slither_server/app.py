
from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import subprocess
import os
import hmac

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/analyze', methods=['POST'])
def analyze():
    # Optional shared-secret protection for the hosted backend.
    expected_token = os.environ.get('SLITHER_API_TOKEN')

    if expected_token:
        supplied_token = request.headers.get('X-Slither-Token', '')

        if not hmac.compare_digest(supplied_token, expected_token):
            return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    code = data.get('code', '')

    if not isinstance(code, str) or not code.strip():
        return jsonify({'error': 'Missing Solidity code'}), 400

    with tempfile.TemporaryDirectory() as tmpdir:
        solidity_file = os.path.join(tmpdir, 'TestContract.sol')

        with open(solidity_file, 'w', encoding='utf-8') as f:
            f.write(code)

        try:
            result = subprocess.run(
                ['slither', solidity_file, '--json', '-'],
                capture_output=True,
                text=True,
                timeout=50
            )

            return jsonify({
                'success': True,
                'slither_output': result.stdout,
                'slither_errors': result.stderr
            })

        except subprocess.TimeoutExpired:
            return jsonify({
                'error': 'Slither analysis exceeded the time limit.'
            }), 504

        except Exception as e:
            app.logger.exception('Slither analysis failed')
            return jsonify({
                'error': 'Slither analysis failed.',
                'details': str(e)
            }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5005'))
    app.run(host='0.0.0.0', port=port)
