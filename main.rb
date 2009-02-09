$: << File.dirname(__FILE__) + "/lib"

require 'rubygems'
require 'sinatra'
require 'lighthouse'
require 'flash'
require 'andand'

use Flash

configure :production do
  # Use drop.io as a default until we can set these in production properly.
  Sinatra::Default.set :account, "dropio"
  Sinatra::Default.set :project_id, 8242
end

configure do
  USERS = {}
  
  ActiveResource::Base.logger = Logger.new(STDOUT)
  ActiveResource::Base.logger.level = Logger::WARN
  
  Sinatra::Default.set :ticket_lists_file, "data/ticket_order.yml"
  
  env_file = File.dirname(__FILE__) + "/config/environment.rb"
  load env_file if File.exist? env_file
  
  # Required options
  [:account, :project_id].each do |option|
    Sinatra::Application.send(option) rescue raise("Required option not set: #{option}")
  end
  
  Lighthouse.account = Sinatra::Application.account
  
  enable :sessions
end

helpers do
  def flash
    session[:flash]
  end
  
  # "Alfred E. Newman" => "AEN"
  def initials(name)
    name.split(/\s+/).map { |part| part[0,1] }.join.upcase
  end
  
  def load_lists
    lists = YAML.load_file(options.ticket_lists_file) rescue {}
    lists = {} unless lists.is_a? Hash
    lists
  end
  
  def write_lists(lists)
    File.open(options.ticket_lists_file, 'w') do |file|
      file.write lists.to_yaml
    end
  end
  
  def write_list(name, list)
    write_lists load_lists.merge(name => list)
  end
  
  def ticket_url(ticket)
    "http://#{options.account}.lighthouseapp.com/projects/#{options.project_id}/tickets/#{ticket.id}-#{ticket.permalink}"
  end
  
  def ticket_details(ticket)
    {
      :id => ticket.id,
      :url => ticket_url(ticket),
      :title => ticket.title,
      :requester => ticket.creator_id.andand { |id| user(id).name },
      :responsible => ticket.assigned_user_id.andand { |id| user(id).name },
      :responsible_initials => ticket.assigned_user_id.andand { |id| initials(user(id).name) },
      :state => ticket.state,
      :description => ticket.attributes['body_html'],
      :tags => ticket.tags.join(", ")
    }
  end
  
  def user(id, the_token=token)
    raise ArgumentError, "Can't look up user with nil id" if id.nil?
    USERS[id] ||= Lighthouse::User.find(id, :params => { :_token => the_token })
  end
  
  
  ## Sessions
  
  def login(token)
    begin
      token_object = Lighthouse::Token.find(token, :params => { :_token => token })
      user = user(token_object.user_id, token)
      session[:token] = token
      session[:user_name] = user.name
    rescue ActiveResource::UnauthorizedAccess
      flash[:error] = "That token wasn't accepted for the account #{options.account}"
      redirect '/login'
    end
  end
  
  def logout
    session[:token] = nil
    session[:user_name] = nil
  end
  
  def logged_in?
    not (session[:token].nil? || session[:token].empty?)
  end
  
  def token
    session[:token]
  end
  
  def user_name
    session[:user_name]
  end
end


## Pages

get '/' do
  redirect '/login'
end

get '/login' do
  haml :login, :locals => { :account => options.account }
end

post '/login' do
  login params[:token]
  redirect '/dashboard'
end

get '/logout' do
  logout
  redirect '/'
end

get '/dashboard' do
  redirect '/login' unless logged_in?
  haml :dashboard
end


## Ajax Calls

get '/tickets' do
  page = params[:page] || 1
  tickets = Lighthouse::Ticket.find(:all, :params => { :_token => token, :project_id => options.project_id, :q => "state:open sort:number", :page => page })
  tickets.map {|t| ticket_details(t) }.to_json
end

get '/tickets/:id' do
  ticket_details(Lighthouse::Ticket.find(params[:id], :params => { :_token => token, :project_id => options.project_id})).to_json
end

get '/lists' do
  load_lists.to_json
end

get '/lists/:list' do
  lists = load_lists
  throw :halt, [404, "Not found"] unless lists.key? params[:list]
  load_lists[params[:list]].to_json
end

post '/lists/:list' do
  throw :halt, [404, "Not found"] if params[:list] == "icebox"
  # ticket_param will be a single ticket id, not a one-element array, if only one is given.
  ticket_param = params["ticket[]"] || params["ticket"]  # Handle different versions of Sinatra/Rack
  write_list params[:list], [ticket_param].flatten.compact.map { |tid| tid.to_i }
end


## Stylesheet

get '/stylesheets/tracklight.css' do
  response['Content-Type'] = 'text/css; charset=utf-8'
  sass :tracklight
end
