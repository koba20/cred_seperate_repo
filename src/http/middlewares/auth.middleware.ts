/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import AppException from '../../exceptions/AppException';
import TokenService from '../../services/Token.service';
import UserService from '../../services/User.service';
import httpStatus from 'http-status';
import AdminService from '../../services/Admin.service';

export type RequestType = {
  [prop: string]: any;
} & Request;

export const isUserAuthenticated = async (
  req: RequestType,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const _noAuth = () =>
      next(
        new AppException(
          `Oops!, you are not authenticated, login`,
          httpStatus.UNAUTHORIZED,
        ),
      );

    const { authorization } = req.headers;
    const _authHeader = authorization;
    if (!_authHeader) return _noAuth();
    const [id, token] = _authHeader.split(' ');
    if (!id || !token) return _noAuth();
    if (id.trim().toLowerCase() !== 'bearer') return _noAuth();
    const decodedToken = await new TokenService().verifyToken(token);
    const { sub, type }: any = decodedToken;
    if (type === 'refresh')
      return next(
        new AppException('Oops!, wrong token type', httpStatus.FORBIDDEN),
      );
    const user = await new UserService().getUserById(sub);
    if (!user)
      return next(
        new AppException('Oops!, user does not exist', httpStatus.NOT_FOUND),
      );

    /** Store the result in a req object */
    req.user = user;
    next();
  } catch (err: any) {
    return next(
      new AppException(err.message, err.status || httpStatus.UNAUTHORIZED),
    );
  }
};

export const isAdminAuthenticated = async (
  req: RequestType,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const _noAuth = () =>
      next(
        new AppException(
          `Oops!, you are not authenticated, login`,
          httpStatus.UNAUTHORIZED,
        ),
      );

    const { authorization } = req.headers;
    const _authHeader = authorization;
    if (!_authHeader) return _noAuth();
    const [id, token] = _authHeader.split(' ');
    if (!id || !token) return _noAuth();
    if (id.trim().toLowerCase() !== 'bearer') return _noAuth();
    const decodedToken = await new TokenService().verifyToken(token);
    const { sub, type }: any = decodedToken;
    if (type === 'refresh')
      return next(
        new AppException('Oops!, wrong token type', httpStatus.FORBIDDEN),
      );
    const admin = await new AdminService().getAdminById(sub);
    if (!admin)
      return next(
        new AppException('Oops!, admin does not exist', httpStatus.NOT_FOUND),
      );

    /** Store the result in a req object */
    req.admin = admin;
    next();
  } catch (err: any) {
    return next(
      new AppException(err.message, err.status || httpStatus.UNAUTHORIZED),
    );
  }
};
