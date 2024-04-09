const usersService = require('./users-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

/**
 * Handle get list of users request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUsers(request, response, next) {
  try {
    const users = await usersService.getUsers();
    return response.status(200).json(users);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle get user detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUser(request, response, next) {
  try {
    const user = await usersService.getUser(request.params.id);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createUser(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.confrimPassword;

    // Konfirmasi password yang diisi ini harus sama dengan password yang diisi. Jika
    // tidak sama, maka kembalikan error dengan status code 403 (INVALID_PASSWORD).
    if (password != password_confirm) {
      throw errorResponder(errorTypes.INVALID_PASSWORD, 'Invalid Password');
    }

    //Jika email sudah terdaftar sebelumnya,
    // maka kembalikan error dengan status code 409(EMAIL_ALREADY_TAKEN).
    const emailTaken = await usersService.isEmailTaken(email);
    if (emailTaken == true) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'EMAIL_ALREADY_TAKEN'
      );
    } else {
      const success = await usersService.createUser(name, email, password);
      if (!success) {
        throw errorResponder(
          errorTypes.UNPROCESSABLE_ENTITY,
          'Failed to create user'
        );
      }
      return response.status(200).json({ name, email });
    }
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle update user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateUser(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;

    //Jika email sudah terdaftar sebelumnya,
    // maka kembalikan error dengan status code 409(EMAIL_ALREADY_TAKEN).
    const emailTaken = await usersService.isEmailTaken(email);
    if (emailTaken == true) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'EMAIL_ALREADY_TAKEN'
      );
    } else {
      const success = await usersService.updateUser(id, name, email);
      if (!success) {
        throw errorResponder(
          errorTypes.UNPROCESSABLE_ENTITY,
          'Failed to create user'
        );
      }
      return response.status(200).json({ id });
    }
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteUser(request, response, next) {
  try {
    const id = request.params.id;

    const success = await usersService.deleteUser(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(request, response, next) {
  try {
    const id = request.params.id;
    const oldPassword = request.body.oldPassword;
    const newPassword = request.body.newPassword;
    const confirmPassword = request.body.confirmPassword;

    // Konfirmasi password baru harus sama dengan password baru
    if (newPassword != confirmPassword) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'New Password and Confirm Password do not match'
      );
    }

    // Password lama harus sama dengan password saat ini.
    else if (oldPassword == newPassword) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Old Password must be the same as the current password'
      );
    }

    // Check password lama apakah sama dengan data di mongodb
    else {
      const check_oldPassword = await usersService.check_oldPassword(
        id,
        oldPassword,
        newPassword
      );
      if (!check_oldPassword) {
        throw errorResponder(
          errorTypes.UNPROCESSABLE_ENTITY,
          'Failed to change Password'
        );
      }

      return response.status(200).json({ id, oldPassword, newPassword });
    }
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
};
