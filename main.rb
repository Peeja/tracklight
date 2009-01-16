require 'rubygems'
require 'sinatra'
require 'json'
require 'lighthouse'

Lighthouse.account = 'dropio'
Lighthouse.token = '85d698469180f0c1b0bd9ba45a79b36b5f38e736'
PROJECT_ID = 4623 unless defined?(PROJECT_ID)

get '/tickets' do
  page = params[:page] || 1
  tickets = Lighthouse::Ticket.find(:all, :params => { :project_id => PROJECT_ID, :q => "responsible:me", :page => page })
  tickets.map { |t| {
    :id => t.id,
    :title => t.title
  } }.to_json
end
