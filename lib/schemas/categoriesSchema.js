import joi from 'joi';

const categoryModel = joi.object({
    name: joi.string().required()
});

export default categoryModel;