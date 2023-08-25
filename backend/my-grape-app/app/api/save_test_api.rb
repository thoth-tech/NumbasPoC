require 'grape'
require_relative 'entities/save_test'

class SaveTestAPI < Grape::API
  format :json

  # Handle common exceptions
  rescue_from :all do |e|
    error!({ error: e.message }, 500)
  end

  rescue_from ActiveRecord::RecordNotFound do |e|
    error!({ error: e.message }, 404)
  end

  rescue_from Grape::Exceptions::ValidationErrors do |e|
    error!({ errors: e.full_messages }, 400)
  end

  helpers do
    def render_success(data, with_entity)
      present :data, data, with: with_entity
    end
  end

  resources :savetests do
    # Endpoint to retrieve all test results, ordered by ID in descending order
    desc 'Get all test results'
    get do
      tests = SaveTest.order(id: :desc)
      render_success(tests, Entities::SaveTest)
    end

    # Get latest test or create a default test and return this to front end.
    desc 'Get the latest test result'
    get 'latest' do
      test = SaveTest.order(id: :desc).first_or_create!(
        name: "Default Test", 
        attempt_number: 0, 
        pass_status: false, 
        suspend_data: "{}", 
        completed: false
      )
      render_success(test, Entities::SaveTest)
    end
    
    # Endpoint to retrieve a specific test result by its ID
    desc 'Get a specific test result'
    params do
      requires :id, type: String, desc: 'ID of the test'
    end
    get ':id' do
      present SaveTest.find(params[:id]), with: Entities::SaveTest
    end

    # Endpoint to create a new test result
    desc 'Create a test result'
    params do
      requires :name, type: String, desc: 'Name of the test'
      requires :attempt_number, type: Integer, desc: 'Test attempt number'
      requires :pass_status, type: Boolean, desc: 'Pass status'
      requires :suspend_data, type: String, desc: 'Suspended data in JSON'
      requires :completed, type: Boolean, desc: 'Completion status'
      optional :attempted_at, type: DateTime, desc: 'Timestamp of the test attempt'
    end
    post do
      test = SaveTest.create!(params)
      render_success(test, Entities::SaveTest)
    end

    # Endpoint to update an existing test result by its ID
    desc 'Update a test result'
    params do
      requires :id, type: String, desc: 'ID of the test'
      optional :name, type: String, desc: 'Name of the test'
      optional :attempt_number, type: Integer, desc: 'Test attempt number'
      optional :pass_status, type: Boolean, desc: 'Pass status'
      optional :suspend_data, type: String, desc: 'Suspended data in JSON'
      optional :completed, type: Boolean, desc: 'Completion status'
      optional :attempted_at, type: DateTime, desc: 'Timestamp of the test attempt'
    end
    put ':id' do
      SaveTest.find(params[:id]).update!(params.except(:id))
    end

    # Endpoint to delete a specific test result by its ID
    desc 'Delete a test result'
    params do
      requires :id, type: String, desc: 'ID of the test'
    end
    delete ':id' do
      SaveTest.find(params[:id]).destroy!
    end

    # Endpoint to update the suspend data for a specific test result by its ID
    desc 'Update suspend data for a test result'
    params do
      requires :id, type: String, desc: 'ID of the test'
      requires :suspend_data, type: String, desc: 'Suspended data in JSON'
    end
    put ':id/suspend' do
      test = SaveTest.find(params[:id])
      begin
        # Ensure it's valid JSON
        parsed_data = JSON.parse(params[:suspend_data])
        test.update!(suspend_data: parsed_data)
        test
      rescue JSON::ParserError
        error!('Invalid JSON provided', 400)
      end
    end
  end
end
