require 'dotenv/load'
require 'httparty'
require 'json'
require 'rack'
require 'rack/contrib'

class WhatsAppBrain
  BRIDGE_URL = ENV['BRIDGE_URL'] || 'http://localhost:3001/send-message'
  GROQ_API_KEY = ENV['GEMINI_API_KEY'] # Keeping the variable name for simplicity or renaming it
  GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

  def call(env)
    req = Rack::Request.new(env)

    if req.path == '/api/webhook/whatsapp' && req.post?
      handle_webhook(req)
    else
      [404, { 'Content-Type' => 'text/plain' }, ['Not Found']]
    end
  end

  private

  def handle_webhook(req)
    data = JSON.parse(req.body.read)
    from = data['from']
    body = data['body']

    puts "Processing message from #{from}: #{body}"

    # Get AI Response
    ai_response = get_groq_response(body)
    
    # Send back to Bridge
    send_to_bridge(from, ai_response)

    [200, { 'Content-Type' => 'application/json' }, [{ status: 'ok' }.to_json]]
  rescue => e
    puts "Error: #{e.message}"
    [500, { 'Content-Type' => 'application/json' }, [{ error: e.message }.to_json]]
  end

  def get_groq_response(text)
    return "Maaf, saya sedang tidak bisa berpikir (API Key belum diatur)." if GROQ_API_KEY.nil? || GROQ_API_KEY.empty?

    payload = {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Anda adalah asisten chatbot WhatsApp yang pintar dan ramah. Selalu balas dalam Bahasa Indonesia secara singkat dan padat." },
        { role: "user", content: text }
      ]
    }.to_json

    response = HTTParty.post(GROQ_URL, 
      body: payload,
      headers: { 
        'Content-Type' => 'application/json',
        'Authorization' => "Bearer #{GROQ_API_KEY}"
      }
    )

    if response.success?
      parsed = JSON.parse(response.body)
      parsed.dig('choices', 0, 'message', 'content') || "Saya bingung harus menjawab apa."
    else
      "Gagal menghubungi AI: #{response.code} - #{response.body}"
    end
  end

  def send_to_bridge(to, body)
    HTTParty.post(BRIDGE_URL,
      body: { to: to, body: body }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )
    puts "Response sent to Bridge for #{to}"
  end
end

# To be run with eksa-server
# app = WhatsAppBrain.new
