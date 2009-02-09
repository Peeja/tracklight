require 'rubygems'
require 'sinatra'

my_app_root = File.expand_path(File.dirname(__FILE__) + '/..')

set :environment, :production
set :public, my_app_root + '/public'

disable :run, :reload

require my_app_root + "/main.rb"

run Sinatra::Application
