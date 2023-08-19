class SaveTestAPI < Grape::API
  # Define a set of routes under the 'savetests' resource
  resources :savetests do
    
    # Endpoint to retrieve all test results, ordered by ID in descending order
    desc 'Get all test results'
    get do
      SaveTest.order(id: :desc)
    end

    # Endpoint to retrieve the latest test result
    desc 'Get the latest test result'
    get 'latest' do
      SaveTest.order(id: :desc).first
    end

    # Endpoint to retrieve a specific test result by its ID
    desc 'Get a specific test result'
    params do
      requires :id, type: String, desc: 'ID of the test'
    end
    get ':id' do
      SaveTest.where(id: params[:id]).first!
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
      SaveTest.create!(params)
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
      test.update!(suspend_data: params[:suspend_data])
      test
    end
  end
end
