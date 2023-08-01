class SaveTestAPI < Grape::API
  resources :savetest do
    desc 'Get all test results'
    get do
      SaveTest.all
    end

    desc 'Get a specific test result'
    params do
      requires :id, type: String, desc: 'ID of the test'
    end
    get ':id' do
      SaveTest.where(id: params[:id]).first!
    end

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

    desc 'Delete a test result'
    params do
      requires :id, type: String, desc: 'ID of the test'
    end
    delete ':id' do
      SaveTest.find(params[:id]).destroy!
    end
  end
end
