module Entities
  class SaveTest < Grape::Entity
    expose :id
    expose :name
    expose :attempt_number
    expose :pass_status
    expose :suspend_data
    expose :completed
    expose :cmi_entry
    expose :exam_result
  end
end