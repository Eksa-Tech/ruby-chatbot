require_relative 'app'

use Rack::JSONBodyParser
run WhatsAppBrain.new
