require 'rubygems'
require 'sinatra'

app_root = File.expand_path(File.dirname(__FILE__) + '/..')

$LOAD_PATH << app_root+'/vendor/Caged-lighthouse-api-1.0.0/lib'
$LOAD_PATH << app_root+'/vendor/andand-1.3.1/lib'
$LOAD_PATH << app_root+'/vendor/haml-2.0.7/lib'

set :environment, :production
set :public, app_root + '/public'
set :views,  app_root + '/views'

disable :run, :reload

require app_root + "/main.rb"

run Sinatra::Application
