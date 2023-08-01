
require_relative '../app/api/numbas_api'
require_relative '../app/api/save_test_api'
Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
  mount NumbasAPI => '/api'
  mount SaveTestAPI => '/api'

end
