module Entities
    class SaveTest < Grape::Entity
      expose :id, :name, :attempt_number, :pass_status, :suspend_data
    end
  end
  