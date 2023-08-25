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

    get 'latest' do
      # Try to find the latest test; if not found, initialize a new test without saving it
      test = SaveTest.order(id: :desc).first_or_initialize(
        name: "Default Test", 
        attempt_number: 0, 
        pass_status: false, 
        suspend_data: "{}", 
        completed: false,
        cmi_entry: 'ab-initio'  # set default value for new tests
      )
        
      puts "Test attributes before update: #{test.attributes.inspect}"
        
      # If the test was just initialized and not persisted, save it
      # Else, if the test is marked as completed, create a new test
      # Else, update its cmi_entry to 'resume' and increment its attempt_number
      if test.new_record?
        test.save!
      elsif test.completed
        test = SaveTest.create!(
          name: "Default Test", 
          attempt_number: 0, 
          pass_status: false, 
          suspend_data: "{}", 
          completed: false,
          cmi_entry: 'ab-initio'
        )
      else
        test.increment(:attempt_number).update(cmi_entry: 'resume')
      end
        
      puts "Test attributes after update: #{test.attributes.inspect}"
        
      present :data, test, with: Entities::SaveTest
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
      optional :exam_result, type: String, desc: 'Exam result'
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
      optional :exam_result, type: String, desc: 'Exam result'
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
      test = SaveTest.find_by(id: params[:id])
    
      # Handle case when test is not found
      error!('Test not found', 404) unless test
    
      begin
        # Ensure it's valid JSON
        test.update!(suspend_data: params[:suspend_data])
        puts "Received suspend_data: #{params[:suspend_data]}"

        { message: 'Suspend data updated successfully', test: test }
      rescue JSON::ParserError
        error!('Invalid JSON provided', 400)
      rescue => e
        error!(e.message, 500)
      end
    end
    
  end
end
